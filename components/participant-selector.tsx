"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

type Participant = {
  nomorPeserta: string;
  namaPeserta: string;
};

type ParticipantSelectorProps = {
  className?: string;
};

const SELECTED_PARTICIPANT_ID_COOKIE = "selected-participant-id";
const SELECTED_PARTICIPANT_NAME_COOKIE = "selected-participant-name";

function getCookieValue(cookieName: string) {
  if (typeof document === "undefined") {
    return undefined;
  }

  const cookies = document.cookie.split("; ");

  for (const cookie of cookies) {
    const [name, ...valueParts] = cookie.split("=");
    if (name === cookieName) {
      return decodeURIComponent(valueParts.join("="));
    }
  }

  return undefined;
}

function setCookie(cookieName: string, value: string) {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `${cookieName}=${encodeURIComponent(
    value
  )}; path=/; max-age=${60 * 60 * 24 * 365}`;
}

function persistSelection(participant?: Participant) {
  if (!participant) {
    return;
  }

  setCookie(SELECTED_PARTICIPANT_ID_COOKIE, participant.nomorPeserta);
  setCookie(SELECTED_PARTICIPANT_NAME_COOKIE, participant.namaPeserta);
}

export function ParticipantSelector(props: ParticipantSelectorProps) {
  const { className } = props;

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [selectedNomorPeserta, setSelectedNomorPeserta] = useState<
    string | undefined
  >(() => getCookieValue(SELECTED_PARTICIPANT_ID_COOKIE));
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadParticipants() {
      try {
        setIsLoading(true);
        const response = await fetch("/api/participants", {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Tidak dapat memuat data peserta.");
        }

        const json = (await response.json()) as {
          participants: Array<{
            nomorPeserta: string;
            namaPeserta: string;
          }>;
        };

        const fetchedParticipants = json.participants ?? [];
        setParticipants(fetchedParticipants);

        if (fetchedParticipants.length === 0) {
          setSelectedNomorPeserta(undefined);
          return;
        }

        const storedId = getCookieValue(SELECTED_PARTICIPANT_ID_COOKIE);
        const initialParticipant = fetchedParticipants.find(
          (participant) => participant.nomorPeserta === storedId
        );

        const participantToUse =
          initialParticipant ?? fetchedParticipants[0];

        setSelectedNomorPeserta(participantToUse.nomorPeserta);
        persistSelection(participantToUse);
      } catch (err) {
        if ((err as { name?: string }).name === "AbortError") {
          return;
        }
        setError(
          err instanceof Error
            ? err.message
            : "Tidak dapat memuat data peserta."
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadParticipants();

    return () => controller.abort();
  }, []);

  const handleSelectionChange = (nomorPeserta: string) => {
    setSelectedNomorPeserta(nomorPeserta);
    const participant = participants.find(
      (current) => current.nomorPeserta === nomorPeserta
    );
    persistSelection(participant);
  };

  const hasParticipants = participants.length > 0;

  const selectPlaceholder = useMemo(() => {
    if (isLoading) {
      return "Memuat peserta...";
    }
    if (error) {
      return "Gagal memuat peserta";
    }
    return "Pilih peserta";
  }, [error, isLoading]);

  return (
    <div className={cn("min-w-[180px]", className)}>
      <Select
        disabled={!hasParticipants || !!error || isLoading}
        onValueChange={handleSelectionChange}
        value={selectedNomorPeserta}
      >
        <SelectTrigger className="h-8 w-full min-w-[180px]">
          <SelectValue placeholder={selectPlaceholder} />
        </SelectTrigger>
        <SelectContent>
          {participants.map((participant) => (
            <SelectItem
              key={participant.nomorPeserta}
              value={participant.nomorPeserta}
            >
              {participant.namaPeserta}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
