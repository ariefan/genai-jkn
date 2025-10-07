const instructionTimestampFormatter = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Jakarta",
});

export function formatInstructionTimestamp(timestamp: string) {
  try {
    const date = new Date(timestamp);

    if (Number.isNaN(date.getTime())) {
      return undefined;
    }

    return `${instructionTimestampFormatter.format(date)} WIB`;
  } catch (error) {
    console.warn("Unable to format instruction timestamp:", error);
    return undefined;
  }
}

