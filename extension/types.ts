interface SavedMedia {
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

interface StorageData {
  savedMedia: SavedMedia[];
}

type MessageType =
  | { type: 'UPDATE_BADGE' }
  | { type: 'GET_COUNT'; callback: (count: number) => void };
