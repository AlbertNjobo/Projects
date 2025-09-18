// app/vote/[id]/page.tsx
export default function VotePage({ params }: { params: { id: string } }) {
  return <h1>Vote on Poll {params.id}</h1>;
}
