import { ProgramDetail } from '@/components/periodization/program_detail';

type Props = {
  params: {
    id: string;
  };
};

export default function ProgramDetailPage({ params }: Props) {
  return (
    <div className="container mx-auto px-4 py-8">
      <ProgramDetail programId={params.id} />
    </div>
  );
}
