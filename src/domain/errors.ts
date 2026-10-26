export class TrackerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class ValidationError extends TrackerError {}

export class NotFoundError extends TrackerError {}

export class ConflictError extends TrackerError {}

/** Jalankan blok, ubah error jadi pesan CLI yang rapi (dipakai presentation layer). */
export function toCliMessage(error: unknown): { message: string; code: number } {
  if (error instanceof TrackerError) return { message: error.message, code: 1 };
  if (error instanceof Error) return { message: error.message, code: 1 };
  return { message: String(error), code: 1 };
}
