import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const schema = z.object({
  name: z.string().trim().min(1, "Name is required"),
});

type FormValues = z.infer<typeof schema>;

interface NameFormDialogProps {
  title: string;
  description: string;
  fieldLabel: string;
  submitLabel: string;
  initialName?: string;
  placeholder?: string;
  testId: string;
  onSubmit: (name: string) => void;
  onClose: () => void;
}

/**
 * Shared by create and rename. Mounted only while its dialog is open, so
 * `defaultValues` is enough to seed the field and no reset effect is needed.
 */
export function NameFormDialog({
  title,
  description,
  fieldLabel,
  submitLabel,
  initialName = "",
  placeholder,
  testId,
  onSubmit,
  onClose,
}: NameFormDialogProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: initialName },
  });

  const submit = handleSubmit((values) => {
    onSubmit(values.name);
  });

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2 py-2">
            <Label htmlFor={`${testId}-input`}>{fieldLabel}</Label>
            <Input
              id={`${testId}-input`}
              className="font-mono text-sm"
              placeholder={placeholder}
              data-testid={`input-${testId}`}
              autoFocus
              {...register("name")}
            />
            {errors.name && (
              <p role="alert" className="text-sm text-destructive">
                {errors.name.message}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" data-testid={`button-${testId}-submit`}>
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
