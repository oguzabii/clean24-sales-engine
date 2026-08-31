import GoogleFormConversion from "@/components/GoogleFormConversion";

export default function DankeLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <GoogleFormConversion
        conversionId={process.env.NEXT_PUBLIC_GADS_CONVERSION_ID}
        conversionLabel={process.env.NEXT_PUBLIC_GADS_FORM_CONVERSION_LABEL}
      />
      {children}
    </>
  );
}
