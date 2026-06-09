import { Button, Group, Stepper } from "@mantine/core";
import { useState } from "react";

export const App = () => {
  const [active, setActive] = useState(1);
  const nextStep = () => {
    setActive((current) => (current < 3 ? current + 1 : current));
  };
  const prevStep = () => {
    setActive((current) => (current > 0 ? current - 1 : current));
  };

  return (
    <>
      <Stepper active={active} onStepClick={setActive}>
        <Stepper.Step description="Create an account" label="First step">
          Step 1 content: Create an account
        </Stepper.Step>
        <Stepper.Step description="Verify email" label="Second step">
          Step 2 content: Verify email
        </Stepper.Step>
        <Stepper.Step description="Get full access" label="Final step">
          Step 3 content: Get full access
        </Stepper.Step>
        <Stepper.Completed>
          Completed, click back button to get to previous step
        </Stepper.Completed>
      </Stepper>

      <Group justify="center" mt="xl">
        <Button onClick={prevStep} variant="default">
          Back
        </Button>
        <Button onClick={nextStep}>Next step</Button>
      </Group>
    </>
  );
};
