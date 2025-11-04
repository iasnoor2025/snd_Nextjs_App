import { H2SCardService } from '@/lib/services/h2s-card-service';
import { H2SCardPrint } from '@/components/h2s-card/H2SCardPrint';
import { notFound } from 'next/navigation';

export default async function H2SCardPublicPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { id } = await params;
  const cardData = await H2SCardService.getCardData(parseInt(id));

  if (!cardData) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold mb-6 text-center">H2S Certification Card</h1>
          <H2SCardPrint cardData={cardData} />
        </div>
      </div>
    </div>
  );
}



