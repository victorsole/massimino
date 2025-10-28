import { AthleteProfile } from '@/components/periodization/athlete_profile';

type Props = {
  params: {
    slug: string;
  };
};

export default function AthleteProfilePage({ params }: Props) {
  return (
    <div className="container mx-auto px-4 py-8">
      <AthleteProfile slug={params.slug} />
    </div>
  );
}
