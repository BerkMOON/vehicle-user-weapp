import axios from 'axios'
import * as fs from 'fs'
import * as path from 'path'
import * as readline from 'readline'

interface ApifoxApi {
  id: string
  name: string
  path: string
  method: string
  description: string
  parameters: any
  requestBody: any
  responses: any
}

interface GenerateConfig {
  apiId: string
  prefix: string
  apiName: string
  outputPath: string
}

// 创建交互式输入
function createInterface(): readline.Interface {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })
}

// 获取用户输入
async function getUserInput(): Promise<GenerateConfig> {
  const rl = createInterface()

  const question = (query: string): Promise<string> => {
    return new Promise((resolve) => {
      rl.question(query, (answer) => {
        resolve(answer)
      })
    })
  }

  const apiId = await question('请输入API的指定目录ID (例如：48648690): ')
  const prefix = await question('请输入API前缀 (例如: http://127.0.0.1:8888/api/business/coupon): ')
  const apiName = await question('请输入API名称 (例如: CouponAPI): ')
  const outputPath = await question('请输入输出路径 (例如: couponApi): ')

  rl.close()

  return { prefix, apiName, outputPath, apiId }
}

function generateTypeDefinition(schema: any): string {
  if (!schema) return 'any'
  
  // 先处理响应结构
  if (schema.properties?.response_status && schema.properties?.data) {
    const dataSchema = schema.properties.data
    // 检查 data 内部是否有分页结构
    if (dataSchema.properties?.meta?.properties?.total_count && dataSchema.properties?.meta?.properties?.total_page) {
      const { meta, ...otherProps } = dataSchema.properties
      const properties = Object.entries(otherProps).map(([key, prop]: [string, any]) => {
        const required = dataSchema.required?.includes(key) ? '' : '?'
        return `  ${key}${required}: ${generateTypeDefinition(prop)}`
      }).join('\n')
      return `{\n  meta${dataSchema.required?.includes('meta') ? '' : '?'}: PageInfo\n${properties}\n}`
    }
    return generateTypeDefinition(dataSchema)
  }
  
  if (schema.type === 'object' && schema.properties) {
    const properties = Object.entries(schema.properties).map(([key, prop]: [string, any]) => {
      const required = schema.required?.includes(key) ? '' : '?'
      return `  ${key}${required}: ${generateTypeDefinition(prop)}`
    }).join('\n')
    return `{\n${properties}\n}`
  }

  if (schema.type === 'array') {
    return `${generateTypeDefinition(schema.items)}[]`
  }

  const typeMap: Record<string, string> = {
    'string': 'string',
    'integer': 'number',
    'number': 'number',
    'boolean': 'boolean'
  }

  return typeMap[schema.type] || 'any'
}

async function generateApi() {
  const userConfig = await getUserInput()
  // 替换成你的 Apifox 项目 ID 和 API Token
  const projectId = '5084807'
  const access_token = 'APS-LSNw8eiSth02GHtbBycBpOAav0iO1DYH'

  const config = {
    method: 'post',
    url: `https://api.apifox.com/v1/projects/${projectId}/export-openapi?locale=zh-CN`,
    headers: {
      'X-Apifox-Api-Version': '2024-03-28',
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    },
    data: {  // 移除 JSON.stringify
      scope: {
        type: "SELECTED_FOLDERS",
        selectedFolderIds: [userConfig.apiId]
      },
      options: {
        includeApifoxExtensionProperties: false,
        addFoldersToTags: false
      },
      oasVersion: "3.1",
      exportFormat: "JSON"
    }
  };


  try {
    const response = await axios(config)

    // 解析 OpenAPI 格式的数据
    const openApiData = response.data
    const paths = openApiData.paths
    const apis: ApifoxApi[] = Object.entries(paths).map(([path, methods]: [string, any]) => {
      const method = Object.keys(methods)[0]
      const apiInfo = methods[method]
      return {
        id: apiInfo.operationId,
        name: apiInfo.summary,
        path,
        method: method.toUpperCase(),
        description: apiInfo.description,
        parameters: apiInfo.parameters,
        requestBody: apiInfo.requestBody,
        responses: apiInfo.responses
      }
    })

    // 生成类型定义文件内容
    let typingsContent = `import { ResponseInfoType, PageInfo } from "types/common"\n\n`

    for (const api of apis) {
      const functionName = getFunctionName(api.path)
      const method = api.method.toLowerCase()
      const reqSchema = method === 'get'
        ? (api.parameters && api.parameters.length > 0 ? api.parameters : null)
        : api.requestBody?.content?.['application/json']?.schema
      const resSchema = api.responses?.['200']?.content?.['application/json']?.schema

      // 只在有参数时生成请求类型定义
      if (reqSchema) {
        typingsContent += `// ${api.name} 请求参数\n`
        typingsContent += `export interface ${functionName}Request ${method === 'get'
            ? generateParamsType(reqSchema)
            : generateTypeDefinition(reqSchema)
          }\n\n`
      }

      if (resSchema) {
        typingsContent += `// ${api.name} 返回结果\n`
        typingsContent += `export interface ${functionName}Response ${generateTypeDefinition(resSchema)}\n\n`
      }
    }

    // 修改 API 文件内容，只引入存在的类型
    let apiContent = `import { ResponseInfoType } from "types/common"
import { getRequest, postRequest } from ".."
import {
${apis.map(api => {
      const name = getFunctionName(api.path)
      const method = api.method.toLowerCase()
      const reqSchema = method === 'get'
        ? (api.parameters && api.parameters.length > 0 ? api.parameters : null)
        : api.requestBody?.content?.['application/json']?.schema
      const types: string[] = []
      if (reqSchema) types.push(`${name}Request`)
      types.push(`${name}Response`) // 响应类型总是需要的
      return types.join(',\n')
    }).filter(Boolean).join(',\n')}
} from './typings'\n\n`

    apiContent += `const prefix = '${userConfig.prefix}'\n\n`
    apiContent += `export const ${userConfig.apiName} = {\n`

    for (const api of apis) {
      const method = api.method.toLowerCase()
      const functionName = getFunctionName(api.path)
      const reqSchema = method === 'get'
        ? (api.parameters && api.parameters.length > 0 ? api.parameters : null)
        : api.requestBody?.content?.['application/json']?.schema

      apiContent += `
  /**
   * ${api.name}
   * ${api.method} ${api.path}
   * 接口ID：${api.id}
   * 接口地址：https://app.apifox.com/link/project/${projectId}/apis/api-${api.id}
   */
  ${functionName}: (${reqSchema ? `params: ${functionName}Request` : ''}) => ${method}Request<ResponseInfoType<${functionName}Response>>({
    url: \`\${prefix}${api.path}\`${reqSchema ? ',\n    params' : ''}
  }),\n`
    }

    apiContent += `}\n`

    // 写入文件
    const apiDir = path.resolve(__dirname, `../src/request/${userConfig.outputPath}`)
    if (!fs.existsSync(apiDir)) {
      fs.mkdirSync(apiDir, { recursive: true })
    }

    // 写入类型定义文件
    fs.writeFileSync(
      path.resolve(apiDir, 'typings.d.ts'),
      typingsContent
    )

    // 写入 API 文件
    fs.writeFileSync(
      path.resolve(apiDir, 'index.ts'),
      apiContent
    )

    console.log('API 文件生成成功！')
  } catch (error) {
    console.error('生成失败：', error)
  }
}

function getFunctionName(path) {
  // 从路径中提取函数名
  const parts = path.split('/')
  const lastPart = parts[parts.length - 1]
  const camelCaseName = camelCase(lastPart)
  // 确保首字母大写
  return camelCaseName.charAt(0).toUpperCase() + camelCaseName.slice(1)
}

function camelCase(str: string): string {
  return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase())
}

function generateParamsType(parameters: any[]): string {
  if (!parameters || parameters.length === 0) return 'any'

  const properties = parameters.map(param => {
    const required = param.required ? '' : '?'
    return `  ${param.name}${required}: ${generateTypeDefinition(param.schema)}`
  }).join('\n')

  return `{\n${properties}\n}`
}

generateApi()