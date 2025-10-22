"use client";

import { ModeIndicator } from "./ModeIndicator";

/**
 * Composant de prévisualisation pour tester l'affichage du statut
 * Utilisé pour vérifier que l'interface est bien optimisée
 */
export function StatusPreview() {
  return (
    <div className="p-4 bg-gray-800 rounded-lg">
      <h3 className="text-sm font-medium text-gray-300 mb-3">Status Preview</h3>
      <ModeIndicator />
    </div>
  );
}
