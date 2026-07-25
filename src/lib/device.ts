/**
 * Identificador anónimo y estable del dispositivo para los anuncios.
 *
 * No es una cuenta ni identifica a la persona: es un id aleatorio que se guarda
 * localmente y se reutiliza, para que el servidor de anuncios pueda contar
 * usuarios únicos y aplicar el límite de frecuencia (cuántas veces ve alguien el
 * mismo banner) sin pedir login. Se puede borrar en cualquier momento.
 */
const KEY = "macup.ads.deviceId";

export function getDeviceId(): string {
  try {
    let id = localStorage.getItem(KEY);
    if (!id) {
      id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `dev-${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
      localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    return "anon";
  }
}
