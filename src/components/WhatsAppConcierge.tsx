import { useState } from "react"

interface WhatsAppConciergeProps {
  phone?: string
  message?: string
}

export default function WhatsAppConcierge({
  phone = "23052508800",
  message = "Hello Noir & Lumière, I would like to inquire about a piece or bespoke consultation.",
}: WhatsAppConciergeProps) {
  const [isHovered, setIsHovered] = useState(false)
  const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`

  return (
    <div className="fixed bottom-6 right-6 z-40 flex items-center gap-3">
      {/* Tooltip on hover / desktop */}
      <div
        className={`hidden sm:block px-3 py-1.5 rounded-full text-[11px] tracking-wider uppercase font-medium shadow-lg transition-all duration-300 pointer-events-none ${
          isHovered ? "opacity-100 translate-x-0" : "opacity-0 translate-x-2"
        }`}
        style={{
          background: "#1a1814",
          color: "#c9a96e",
          border: "1px solid rgba(201, 169, 110, 0.4)",
        }}
      >
        Atelier Concierge
      </div>

      {/* Floating Button */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="w-13 h-13 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95 group cursor-pointer"
        style={{
          background: "#1a1814",
          border: "1.5px solid #c9a96e",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.25)",
        }}
        aria-label="Contact Atelier Concierge on WhatsApp"
        title="Chat with Noir & Lumière Atelier Concierge"
      >
        {/* WhatsApp Icon */}
        <svg
          className="w-6 h-6 text-[#25D366] transition-transform group-hover:scale-110"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.699c.971.53 1.77.813 2.796.813 3.179 0 5.767-2.587 5.767-5.766.001-3.182-2.586-5.768-5.767-5.768zm0-1.748c4.152 0 7.518 3.366 7.518 7.516 0 4.151-3.366 7.518-7.518 7.518-1.282 0-2.484-.325-3.535-.895l-4.57 1.199 1.222-4.457c-.675-1.121-1.066-2.433-1.066-3.835 0-4.15 3.366-7.518 7.949-7.518v-.028zm4.12 9.475c-.172-.086-1.018-.502-1.176-.56-.157-.057-.272-.086-.387.086-.115.172-.444.56-.545.674-.1.115-.201.129-.373.043-.172-.086-.728-.268-1.387-.855-.512-.457-.858-1.021-.958-1.193-.1-.172-.011-.265.076-.351.077-.077.172-.201.258-.301.086-.1.115-.172.172-.287.057-.115.029-.215-.014-.301-.043-.086-.387-.932-.53-1.277-.14-.336-.282-.29-.387-.295l-.33-.005c-.115 0-.301.043-.459.215-.157.172-.602.588-.602 1.434 0 .846.617 1.663.703 1.778.086.115 1.214 1.854 2.941 2.6 1.727.746 1.727.498 2.043.469.315-.029 1.018-.416 1.161-.818.143-.401.143-.746.1-.818-.043-.072-.158-.115-.33-.201z" />
        </svg>

        {/* Pulsing indicator dot */}
        <span className="absolute top-0 right-0 w-3 h-3 rounded-full bg-[#25D366] border-2 border-[#1a1814] animate-ping" />
        <span className="absolute top-0 right-0 w-3 h-3 rounded-full bg-[#25D366] border-2 border-[#1a1814]" />
      </a>
    </div>
  )
}
