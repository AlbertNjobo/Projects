// types/index.ts
export interface Poll {
  id: string
  user_id: string
  question: string
  created_at: string
  options: Option[]
  votes?: Vote[]
}

export interface Option {
  id: string
  poll_id: string
  text: string
  position: number
}

export interface Vote {
  id: string
  poll_id: string
  option_id: string
  visitor_id: string
  created_at: string
}

export interface CreatePollRequest {
  question: string
  options: string[]
}

export interface VoteRequest {
  option_id: string
  visitor_id: string
}

export interface PollResults {
  poll: Poll
  results: {
    option_id: string
    text: string
    vote_count: number
    percentage: number
  }[]
  total_votes: number
}