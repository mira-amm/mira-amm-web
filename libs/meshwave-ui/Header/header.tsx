import Image from "next/image";

export function Header() {
  return (
    <header className="w-full">
      <div className="max-w-7xl mx-auto">
        <Image
          src="https://axfixdzedlzzumwcftks.supabase.co/storage/v1/object/sign/staging/logo.svg?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5XzA5OTIwOGVlLTRkNmUtNGI4ZC1hN2VjLTcyMDEzOGY1YTEyNCJ9.eyJ1cmwiOiJzdGFnaW5nL2xvZ28uc3ZnIiwiaWF0IjoxNzQ3MTc1MDkyLCJleHAiOjE3Nzg3MTEwOTJ9.Om5ueK1tOOuLP-FyMbSp4-cQb7qa89bEt7FjwptYhkM"
          alt="Mira Stripes"
          height={96}
          width={96}
        />
      </div>
    </header>
  );
}
