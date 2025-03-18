import { Button } from "@/components/ui/button";
import { CaretLeft } from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

interface BackButtonProps {
  onClick?: () => void;
  className?: string;
}

export function BackButton({ onClick, className = "" }: BackButtonProps) {
  const navigate = useNavigate();
  const { t } = useTranslation("common");
  
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(-1);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className={`hover:bg-gray-100 transition-colors -ml-2 ${className}`}
      onClick={handleClick}
    >
      <CaretLeft size={16} weight="duotone" className="mr-1" />
      <span className="text-sm">{t("navigation.back")}</span>
    </Button>
  );
} 