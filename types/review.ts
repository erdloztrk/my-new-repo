export interface Review {
  id: string;
  placeId: string;
  userId: string;
  userName: string;
  rating: number; // 1-5
  comment: string;
  createdAt: {
    seconds: number;
    nanoseconds: number;
  } | Date;
}

export interface ReviewInput {
  placeId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
}

