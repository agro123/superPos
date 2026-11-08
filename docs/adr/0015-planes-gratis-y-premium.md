---
title: ADR 0015 — Planes gratis y premium
status: proposed
owner: equipo frontend
updated: 2026-11-08
related: [0010-super-administrador-de-plataforma.md, 0013-asesor-ia-gemini.md, ../features/users.md]
---

# ADR 0015 — Planes gratis y premium

## Contexto

La propuesta SmartPOS define un modelo freemium: el plan de pago agrega roles adicionales, hasta 3
trabajadores, reportes, nube con respaldo e I.A. El plan (`businesses/{bid}.plan`) solo lo cambia el
super administrador (ADR 0010).

## Decisión propuesta

| Función                                            | Gratis  | Premium | Dónde se impone                         |
| -------------------------------------------------- | ------- | ------- | --------------------------------------- |
| Trabajadores (sin contar al dueño ni a los admins) | 1       | 3       | **Reglas**: cupos `seats/{1..3}`        |
| Roles personalizados                               | No      | Sí      | **Reglas** (`roles/` exige premium)     |
| Más administradores                                | No      | Sí      | **Reglas** (invitar o ascender a admin) |
| Reportes, Asesor I.A.                              | No      | Sí      | App (se calculan en el navegador)       |
| Exportar (Excel/PDF/CSV) y respaldo completo       | No      | Sí      | App                                     |
| Historial de ventas consultable                    | 30 días | 1 año   | App                                     |

- **Cupos:** cada trabajador activo (no admin) tiene `seatId` y existe `seats/{seatId}` con su uid,
  escritos en el mismo batch. Las reglas solo aceptan los cupos del plan (gratis: `1`; premium:
  `1`–`3`); como un cupo es un documento, no hay dos personas en el mismo. Desactivar a un
  trabajador o volverlo admin libera su cupo. Las reglas no pueden contar documentos: los cupos
  numerados resuelven el límite sin contadores ni servidor.
- **Nube:** ambos planes guardan todo en la nube (la app depende de Firestore para funcionar
  offline-first y sincronizar). La diferencia es el **acceso**: historial consultable (30 días vs.
  1 año) y el **respaldo completo exportable** (Excel), solo premium.
- Indicadores: plan en la barra superior, insignia "Premium" en funciones bloqueadas y en el menú,
  avisos con enlace a Configuración → Plan, donde se solicita el cambio por teléfono o correo.

## Consecuencias

- Bajar de plan no expulsa a nadie: los cupos 2–3 ya ocupados se mantienen, pero no se pueden tomar
  nuevos; los roles existentes siguen funcionando, pero no se crean ni editan.
- Reportes, I.A., exportación e historial se pueden saltar con un cliente modificado (los datos de
  ventas son legibles para el POS). Imponerlos exige agregados en servidor (Cloud Functions).
- El historial de 30 días es un límite de consulta, no de almacenamiento.

## Estado

Propuesto.
