# terminals

Terminales POS autorizados por QR y sesiones de trabajo de los empleados.

- **Entidades:** `PosTerminal`, `PairingRequest`, `TerminalSession`, `terminalStatusMachine`
- **Permisos:** `users.manage` (administrar terminales y sesiones); el trabajador abre/cierra la suya.
- **Estado:** sin backend (ADR 0011). Login con contraseña; PIN y QR personal requieren Cloud Functions.
- **API pública:** `index.ts` (`terminalsPages`, `TerminalsPanel`, `useWorkerSession`,
  `useEndWorkerSession`, `useTerminalSessionGuard`). No importar archivos internos desde fuera.
- **Dos instancias de Firebase:** `infrastructure/terminalDevice.ts` usa la del terminal (anónima);
  `terminalAdmin.ts` y `workerSession.ts`, la principal.

Detalle (flujo, reglas y limitaciones): [docs/features/terminals.md](../../../docs/features/terminals.md).
