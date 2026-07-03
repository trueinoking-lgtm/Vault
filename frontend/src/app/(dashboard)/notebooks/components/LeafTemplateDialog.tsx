'use client'

import { useEffect, useState } from 'react'
import type { SourceResponse } from '@/lib/types/api'
import {
  DEFAULT_LEAF_TEMPLATE_ID,
  LEAF_TEMPLATES,
  getLeafTemplateById,
  type LeafTemplateId,
} from '@/lib/notebooks/leaf-templates'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'

interface LeafTemplateDialogProps {
  open: boolean
  source: SourceResponse | null
  onOpenChange: (open: boolean) => void
  onConfirm: (templateId: LeafTemplateId) => void
  disabled?: boolean
}

export function LeafTemplateDialog({
  open,
  source,
  onOpenChange,
  onConfirm,
  disabled = false,
}: LeafTemplateDialogProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<LeafTemplateId>(DEFAULT_LEAF_TEMPLATE_ID)

  useEffect(() => {
    if (open) {
      setSelectedTemplateId(DEFAULT_LEAF_TEMPLATE_ID)
    }
  }, [open])

  const selectedTemplate = getLeafTemplateById(selectedTemplateId)
  const materialTitle = source?.title?.trim() || 'Untitled Material'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Choose Leaf Template</DialogTitle>
          <DialogDescription>
            Pick how you want to turn <span className="font-medium text-foreground">{materialTitle}</span> into a new leaf.
          </DialogDescription>
        </DialogHeader>

        <RadioGroup
          value={selectedTemplateId}
          onValueChange={(value) => setSelectedTemplateId(value as LeafTemplateId)}
          className="gap-3"
          disabled={disabled}
        >
          {LEAF_TEMPLATES.map((template) => (
            <Label
              key={template.id}
              htmlFor={`leaf-template-${template.id}`}
              className="items-start rounded-lg border p-4 hover:border-primary/50 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5"
            >
              <RadioGroupItem id={`leaf-template-${template.id}`} value={template.id} className="mt-1" />
              <div className="space-y-1">
                <div className="text-sm font-semibold text-foreground">{template.label}</div>
                <p className="text-sm text-muted-foreground">{template.description}</p>
              </div>
            </Label>
          ))}
        </RadioGroup>

        <div className="rounded-lg border bg-muted/30 p-4">
          <div className="text-sm font-medium text-foreground">Selected template</div>
          <div className="mt-1 text-sm text-muted-foreground">
            {selectedTemplate.label} — {selectedTemplate.description}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={disabled}>
            Cancel
          </Button>
          <Button type="button" onClick={() => onConfirm(selectedTemplateId)} disabled={disabled}>
            {disabled ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Preparing Leaf…
              </>
            ) : (
              'Continue to Leaf'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
