export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Government banner */}
      <div className="bg-muted/50 border-b border-border px-4 py-2 text-center text-xs text-muted-foreground">
        <span className="font-semibold">🇺🇸</span> An official website of the United States Government
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Header with branding */}
          <div className="text-center mb-8">
            <div className="inline-block w-16 h-16 bg-primary rounded-lg flex items-center justify-center mb-4">
              <span className="text-white text-2xl font-bold">+</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground">HealthGov</h1>
            <p className="text-xs text-muted-foreground mt-1">Federal Health Services Portal</p>
          </div>
          
          {children}
        </div>
      </div>
    </div>
  )
}
