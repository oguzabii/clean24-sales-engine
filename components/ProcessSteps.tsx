const steps = [
  {
    number: "01",
    title: "Richtpreis berechnen",
    desc: "Geben Sie Ihre Wohnungsgrösse und gewünschte Zusatzleistungen ein. In 60 Sekunden erhalten Sie einen unverbindlichen Richtpreis.",
  },
  {
    number: "02",
    title: "Anfrage absenden",
    desc: "Füllen Sie das Kontaktformular aus oder schreiben Sie uns per WhatsApp. Wir melden uns innerhalb von 10 Minuten.",
  },
  {
    number: "03",
    title: "Fixpreis erhalten",
    desc: "Nach Prüfung Ihrer Angaben erhalten Sie einen verbindlichen Fixpreis – transparent, ohne Überraschungen.",
  },
  {
    number: "04",
    title: "Reinigung & Abgabe",
    desc: "Unser Team erscheint pünktlich zum vereinbarten Termin und reinigt Ihre Wohnung nach Schweizer Abgabestandards.",
  },
];

interface ProcessStepsProps {
  title?: string;
}

export default function ProcessSteps({ title = "So läuft es ab" }: ProcessStepsProps) {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">{title}</h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            Von der Anfrage bis zur erfolgreichen Abgabe – unkompliziert und professionell.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={step.number} className="relative">
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-6 left-full w-full h-px bg-gray-200 -translate-x-4 z-0" />
              )}
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg mb-4">
                  {step.number}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
