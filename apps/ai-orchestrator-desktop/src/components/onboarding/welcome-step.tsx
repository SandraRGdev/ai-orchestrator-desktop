interface WelcomeStepProps {
  onNext: () => void;
}

export function WelcomeStep({ onNext }: WelcomeStepProps) {
  return (
    <div className="text-center space-y-6">
      <div className="mb-8">
        <div className="text-6xl mb-4">🤖</div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Bienvenido a AI Orchestrator
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-4 text-lg">
          Tu aplicación de escritorio para orquestación de modelos de IA, comparación y flujos de trabajo multi-agente.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-8">
        <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 transition-colors">
          <div className="text-4xl mb-3">💬</div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Chat</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Conversaciones con uno o múltiples modelos con streaming en tiempo real
          </p>
        </div>

        <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 transition-colors">
          <div className="text-4xl mb-3">⚖️</div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Comparar</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Comparación de modelos simultánea con métricas detalladas
          </p>
        </div>

        <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 transition-colors">
          <div className="text-4xl mb-3">🤖</div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Agentes</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Automatización de flujos de trabajo multi-agente para tareas complejas
          </p>
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-800 dark:text-blue-300">
          <strong>Configuración Rápida:</strong> Te guiaremos en la creación de una contraseña maestra y la configuración de tus proveedores de IA.
        </p>
      </div>

      <button
        onClick={onNext}
        className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-lg hover:shadow-xl"
      >
        Comenzar →
      </button>
    </div>
  );
}
