interface CompletionStepProps {
  onComplete: () => void;
  providers: any[];
}

export function CompletionStep({ onComplete, providers }: CompletionStepProps) {
  const configuredCount = providers.length;

  return (
    <div className="text-center space-y-6">
      <div className="mb-8">
        <div className="text-6xl mb-4">🎉</div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          ¡Todo Está Listo!
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          AI Orchestrator está listo para usar. Esto es lo que puedes hacer:
        </p>
      </div>

      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 text-left">
        <h3 className="font-semibold text-green-900 dark:text-green-300 mb-4">
          ✓ Configuración Completa
        </h3>
        <ul className="space-y-2 text-sm text-green-800 dark:text-green-300">
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Contraseña maestra creada y asegurada</span>
          </li>
          {configuredCount > 0 ? (
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>{configuredCount} proveedor{configuredCount > 1 ? 'es' : ''} configurado{configuredCount > 1 ? 's' : ''}</span>
            </li>
          ) : (
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Modo demo activado — agrega proveedores en Configuración cuando quieras</span>
            </li>
          )}
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Listo para chatear, comparar modelos y ejecutar agentes</span>
          </li>
        </ul>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-8">
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="text-3xl mb-2">💬</div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Comienza a Chatear</h3>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Envía mensajes a modelos de IA al instante
          </p>
        </div>

        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
          <div className="text-3xl mb-2">⚖️</div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Compara Modelos</h3>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Prueba múltiples modelos simultáneamente
          </p>
        </div>

        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="text-3xl mb-2">🤖</div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Ejecuta Agentes</h3>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Automatiza tareas con flujos de trabajo multi-agente
          </p>
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          <strong>Consejo Pro:</strong> Presiona <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs font-mono">Cmd/Ctrl+K</kbd> para abrir la paleta de comandos en cualquier momento.
        </p>
      </div>

      <button
        onClick={onComplete}
        className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-lg hover:shadow-xl"
      >
        Comenzar a Usar AI Orchestrator →
      </button>
    </div>
  );
}
