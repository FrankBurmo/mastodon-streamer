export interface MastodonPost {
  id: string;
  content: string;
  account: {
    username: string;
    display_name: string;
    avatar: string;
  };
  created_at: string;
  media_attachments: Array<{
    type: string;
    url: string;
  }>;
}