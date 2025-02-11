export function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center">
      <div className="text-6xl font-bold relative">
        <span className="text-primary">PAY</span>
        <span className="text-primary-foreground">GUARD</span>
        <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary-foreground mask-text">
          <span className="invisible">PAY</span>
          <span className="invisible">GUARD</span>
        </div>
      </div>
    </div>
  )
}

