import { describe, it, expect } from "vitest";
import {
  cycleData,
  recoveryData,
  sleepData,
  workoutData,
} from "@/lib/wearables/whoop-sync";

describe("whoop payload → Prisma data mapping", () => {
  it("cycleData maps strain/HR/kJ and preserves raw", () => {
    const out = cycleData(
      {
        id: 101,
        user_id: 7,
        created_at: "2026-05-19T08:00:00Z",
        updated_at: "2026-05-19T18:00:00Z",
        start: "2026-05-19T05:00:00Z",
        end: "2026-05-20T05:00:00Z",
        timezone_offset: "-06:00",
        score_state: "SCORED",
        score: {
          strain: 12.5,
          kilojoule: 8000,
          average_heart_rate: 88,
          max_heart_rate: 168,
        },
      },
      "tenant-1",
      "athlete-1",
    );
    expect(out.externalId).toBe("101");
    expect(out.tenantId).toBe("tenant-1");
    expect(out.athleteId).toBe("athlete-1");
    expect((out.start as Date).toISOString()).toBe("2026-05-19T05:00:00.000Z");
    expect((out.end as Date).toISOString()).toBe("2026-05-20T05:00:00.000Z");
    expect(out.strain).toBe(12.5);
    expect(out.maxHr).toBe(168);
    expect(out.scoreState).toBe("SCORED");
    expect(out.raw).toMatchObject({ id: 101 });
  });

  it("cycleData handles missing score (PENDING_SCORE)", () => {
    const out = cycleData(
      {
        id: 102,
        user_id: 7,
        created_at: "",
        updated_at: "",
        start: "2026-05-19T05:00:00Z",
        end: null,
        timezone_offset: "-06:00",
        score_state: "PENDING_SCORE",
      },
      "tenant-1",
      "athlete-1",
    );
    expect(out.strain).toBeNull();
    expect(out.kilojoule).toBeNull();
    expect(out.averageHr).toBeNull();
    expect(out.end).toBeNull();
  });

  it("recoveryData uses cycle_id as cycleExternalId and updated_at as recoveredAt", () => {
    const out = recoveryData(
      {
        cycle_id: 555,
        sleep_id: 999,
        user_id: 7,
        created_at: "2026-05-19T08:00:00Z",
        updated_at: "2026-05-19T08:30:00Z",
        score_state: "SCORED",
        score: {
          recovery_score: 72,
          hrv_rmssd_milli: 64.4,
          resting_heart_rate: 52,
          spo2_percentage: 97.5,
          skin_temp_celsius: 33.1,
        },
      },
      "tenant-1",
      "athlete-1",
    );
    expect(out.cycleExternalId).toBe("555");
    expect(out.sleepExternalId).toBe("999");
    expect((out.recoveredAt as Date).toISOString()).toBe(
      "2026-05-19T08:30:00.000Z",
    );
    expect(out.score).toBe(72);
    expect(out.hrvRmssd).toBe(64.4);
    expect(out.restingHr).toBe(52);
  });

  it("recoveryData handles null sleep_id", () => {
    const out = recoveryData(
      {
        cycle_id: 555,
        sleep_id: null,
        user_id: 7,
        created_at: "2026-05-19T08:00:00Z",
        updated_at: "2026-05-19T08:30:00Z",
        score_state: "UNSCORABLE",
      },
      "t",
      "a",
    );
    expect(out.sleepExternalId).toBeNull();
    expect(out.score).toBeNull();
  });

  it("sleepData sums light + slow + REM into totalAsleepMs", () => {
    const out = sleepData(
      {
        id: 200,
        user_id: 7,
        created_at: "",
        updated_at: "",
        start: "2026-05-19T05:00:00Z",
        end: "2026-05-19T12:00:00Z",
        timezone_offset: "-06:00",
        nap: false,
        score_state: "SCORED",
        score: {
          sleep_performance_percentage: 87,
          sleep_efficiency_percentage: 92,
          stage_summary: {
            total_in_bed_time_milli: 25_200_000,
            total_light_sleep_time_milli: 14_000_000,
            total_slow_wave_sleep_time_milli: 6_000_000,
            total_rem_sleep_time_milli: 4_000_000,
            disturbance_count: 3,
          },
        },
      },
      "t",
      "a",
    );
    expect(out.totalInBedMs).toBe(25_200_000);
    expect(out.totalAsleepMs).toBe(14_000_000 + 6_000_000 + 4_000_000);
    expect(out.disturbances).toBe(3);
    expect(out.performance).toBe(87);
    expect(out.efficiency).toBe(92);
  });

  it("sleepData leaves totalAsleepMs null when no stage data", () => {
    const out = sleepData(
      {
        id: 201,
        user_id: 7,
        created_at: "",
        updated_at: "",
        start: "2026-05-19T05:00:00Z",
        end: "2026-05-19T12:00:00Z",
        timezone_offset: "-06:00",
        nap: true,
        score_state: "PENDING_SCORE",
      },
      "t",
      "a",
    );
    expect(out.totalAsleepMs).toBeNull();
    expect(out.totalInBedMs).toBeNull();
    expect(out.nap).toBe(true);
  });

  it("workoutData maps zone_duration as JSON", () => {
    const out = workoutData(
      {
        id: 300,
        user_id: 7,
        created_at: "",
        updated_at: "",
        start: "2026-05-19T18:00:00Z",
        end: "2026-05-19T19:00:00Z",
        timezone_offset: "-06:00",
        sport_id: 1,
        score_state: "SCORED",
        score: {
          strain: 14.2,
          average_heart_rate: 144,
          max_heart_rate: 178,
          kilojoule: 2200,
          zone_duration: {
            zone_zero_milli: 120_000,
            zone_one_milli: 900_000,
            zone_two_milli: 1_500_000,
            zone_three_milli: 600_000,
            zone_four_milli: 180_000,
            zone_five_milli: 0,
          },
        },
      },
      "t",
      "a",
    );
    expect(out.externalId).toBe("300");
    expect(out.sportId).toBe(1);
    expect(out.strain).toBe(14.2);
    expect(out.zoneDurationMs).toMatchObject({ zone_two_milli: 1_500_000 });
  });
});
