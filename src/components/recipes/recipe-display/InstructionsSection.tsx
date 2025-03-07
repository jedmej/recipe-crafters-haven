import { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { InstructionsSectionProps } from "./types";

const InstructionsSection = memo(
  ({ instructions }: InstructionsSectionProps) => (
    <Card className="overflow-hidden rounded-[48px] border-0 bg-[#BFCFBC]">
      <CardContent className="p-6">
        <h2 className="text-2xl font-heading mb-2">Instructions</h2>
        <ol className="space-y-4">
          {instructions.map((instruction, index) => (
            <li key={index} className="flex gap-4">
              <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-medium">
                {index + 1}
              </span>
              <span className="mt-1">{instruction}</span>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  )
);

export default InstructionsSection; 