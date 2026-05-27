export interface SourceChunk {
  id: string;
  title: string;
  content: string;
  category: string;
  relevance_score: number;
}

export interface ActionCard {
  id: string;
  title: string;
  description: string;
  route: string;
  icon: string;
  category: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: SourceChunk[];
  action_cards?: ActionCard[];
  timestamp: Date;
}
