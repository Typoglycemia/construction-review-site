// components/CompanyCard.tsx
import Link from "next/link";
import Image from "next/image";

type CompanyCardProps = {
  company: {
    id: string;
    name: string;
    prefecture: string;
    city?: string | null;
    logo_url?: string | null;
  };
};

export default function CompanyCard({ company }: CompanyCardProps) {
  return (
    <Link
      href={`/companies/${company.id}`}
      className="block bg-white border-2 border-ink/20 p-3 hover:border-ink/40 transition"
    >
      <div className="w-full aspect-square relative bg-gray-50 rounded mb-2 flex items-center justify-center overflow-hidden">
        {company.logo_url ? (
          <Image
            src={company.logo_url}
            alt={`${company.name}のロゴ`}
            fill
            style={{ objectFit: "contain" }}
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/no-image.png";
            }}
          />
        ) : (
          <span className="text-xs text-gray-400">No Image</span>
        )}
      </div>
      <p className="text-sm font-medium truncate">{company.name}</p>
      <p className="text-xs text-gray-500">
        {company.prefecture}
        {company.city ?? ""}
      </p>
    </Link>
  );
}
