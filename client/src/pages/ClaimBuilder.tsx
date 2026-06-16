import { useState, useEffect, useRef } from "react";
import DOMPurify from "dompurify";
import { Link, useLocation } from "wouter";
import { DashboardLayout, getWorkflowProgress } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  ChevronRight, 
  ChevronLeft, 
  Stethoscope, 
  AlertTriangle, 
  FileText, 
  CheckCircle2, 
  BrainCircuit,
  Bot,
  Plus,
  Trash2,
  Upload,
  Eye,
  Pencil,
  Printer,
  Download,
  Loader2,
  Lightbulb,
  X,
  AlertCircle,
  User
} from "lucide-react";
import { addNotification } from "@/components/NotificationDropdown";
import { CONTACT_EMAIL_ADMIN } from "@/lib/contact";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useStripePriceIds } from "@/hooks/use-stripe-price-ids";
import { useSubscription, PROMO_ACTIVE } from "@/hooks/use-subscription";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";