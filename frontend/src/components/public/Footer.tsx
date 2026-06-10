export default function Footer() {
  return (
    <footer className="bg-iupa-public-green text-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="text-center text-xs text-white/50">
          &copy; {new Date().getFullYear()} Instituto Universitario Patagónico de las Artes. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  )
}