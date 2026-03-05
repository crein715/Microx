export interface SavedMedia {
  id: string;
  mediaUrl: string;
  previewUrl: string;
  mediaType: 'image' | 'gif';
  tweetText: string;
  authorHandle: string;
  authorName: string;
  tweetUrl: string;
  savedAt: number;
}
