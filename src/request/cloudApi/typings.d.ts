export interface Photos {
  id: string;
  url: string;
  name: string;
  created_time: string
}

export interface PhotoInfo {
  photos: Photos[];
  next_token: string;
}
