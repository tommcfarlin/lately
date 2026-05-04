import type { PhotoData } from '@/lib/types/post';

interface PhotoCardProps {
  data: PhotoData;
}

export default function PhotoCard({ data }: PhotoCardProps) {
  return (
    <img
      src={data.public_url}
      alt="Photo"
      className="w-full rounded-lg object-cover"
    />
  );
}
