import { expect, mock, test } from "bun:test";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { WaterPointForm } from "@/components/command/water-points/water-point-form";

test("validates and submits labeled water point fields", async () => {
  const user = userEvent.setup();
  const onSave = mock(() => undefined);

  render(
    <WaterPointForm
      error=""
      initialPoint={null}
      isSaving={false}
      onCancel={() => undefined}
      onSave={onSave}
      zones={[]}
    />,
  );

  await user.type(screen.getByLabelText(/Nama titik/), "Embung Utara");
  await user.type(screen.getByLabelText(/Lintang/), "-1.25");
  await user.type(screen.getByLabelText(/Bujur/), "114.75");
  await user.click(screen.getByRole("button", { name: "Simpan titik air" }));

  expect(onSave).toHaveBeenCalledWith({
    name: "Embung Utara",
    type: "SUMBER_AIR",
    latitude: -1.25,
    longitude: 114.75,
    zoneId: null,
  });
});
