import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { documentSchema, DocumentSchema } from "../schema/document.schema";
import { EXISTING_DOC_NUMBERS } from "../constants/mockDuplicates";

const defaultValues: DocumentSchema = {
  tenVanBan: "",
  soHieuVanBan: "",
  trangThaiHieuLuc: true,
  ngayBanHanh: "",
  ngayHieuLuc: "",
  nguonVanBan: "",
  noiDungVanBan: "",
};

export function useDocumentForm(onSuccess: () => void) {
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<DocumentSchema>({
    resolver: zodResolver(documentSchema),
    defaultValues,
    mode: "onSubmit",
  });

  // Check if document number already exists in mock data
  const checkDuplicate = useCallback((value: string) => {
    const found = EXISTING_DOC_NUMBERS.some(
      (n) => n.toLowerCase() === value.trim().toLowerCase()
    );
    setIsDuplicate(found);
  }, []);

  // Clear duplicate warning when user edits the field
  const clearDuplicate = useCallback(() => {
    setIsDuplicate(false);
  }, []);

  const onSubmit = async (data: DocumentSchema) => {
    setIsSubmitting(true);
    // Simulate async API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    console.log("Submitted document:", data);
    form.reset(defaultValues);
    setIsDuplicate(false);
    setIsSubmitting(false);
    onSuccess();
  };

  const handleCancel = () => {
    if (form.formState.isDirty) {
      const confirmed = window.confirm(
        "Bạn có chắc muốn hủy? Dữ liệu chưa lưu sẽ bị mất."
      );
      if (!confirmed) return;
    }
    form.reset(defaultValues);
    setIsDuplicate(false);
  };

  return {
    form,
    isDuplicate,
    isSubmitting,
    checkDuplicate,
    clearDuplicate,
    onSubmit,
    handleCancel,
  };
}
