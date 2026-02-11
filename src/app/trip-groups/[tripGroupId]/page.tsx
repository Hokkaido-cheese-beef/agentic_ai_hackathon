import { redirect } from "next/navigation";

type TripGroupPageProps = {
  params: Promise<{
    tripGroupId: string;
  }>;
};

export default async function TripGroupPage({ params }: TripGroupPageProps) {
  const { tripGroupId } = await params;
  redirect(`/trip-groups/${tripGroupId}/candidates`);
}
