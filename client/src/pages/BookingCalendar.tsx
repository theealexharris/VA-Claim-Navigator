import { useState, useMemo } from "react";
import {
  startOfMonth,
  endOfMonth,
  startOfDay,
  eachDayOfInterval,
  format,
  isSameDay,
  isBefore,
  addMonths,
  getDay,
} from "date-fns";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { CalendarDays, Clock, ChevronLeft, ChevronRight, CheckCircle2, User, Mail, Phone, FileText } from "lucide-react";

// Available appointment time slots (business hours).
const TIME_SLOTS = [
  "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM",
  "11:00 AM", "11:30 AM", "1:00 PM", "1:30 PM",
  "2:00 PM", "2:30 PM", "3:00 PM", "3:30 PM", "4:00 PM",
];

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface BookingForm {
  fullName: string;
  email: string;
  phone: string;
  subject: string;
}

export default function BookingCalendar() {
  const { toast } = useToast();

  const [viewMonth, setViewMonth] = useState<Date>(startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [form, setForm] = useState<BookingForm>({ fullName: "", email: "", phone: "", subject: "" });

  const today = startOfDay(new Date());

  // Build the grid of day cells for the current month, padded with leading blanks
  // so the 1st lands on the correct weekday column.
  const dayCells = useMemo(() => {
    const start = startOfMonth(viewMonth);
    const end = endOfMonth(viewMonth);
    const days = eachDayOfInterval({ start, end });
    const leadingBlanks = getDay(start); // 0 (Sun) … 6 (Sat)
    return [...Array(leadingBlanks).fill(null), ...days];
  }, [viewMonth]);

  const updateForm = (field: keyof BookingForm, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  // Weekends and past dates are not bookable.
  const isDisabledDate = (day: Date) => isBefore(day, today) || getDay(day) === 0 || getDay(day) === 6;

  const handleSelectDate = (day: Date) => {
    if (isDisabledDate(day)) return;
    setSelectedDate(day);
    setSelectedTime("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedDate || !selectedTime) {
      toast({ title: "Pick a date & time", description: "Please select an available date and time slot.", variant: "destructive" });
      return;
    }
    if (!form.fullName || !form.email || !form.phone || !form.subject) {
      toast({ title: "Required fields", description: "Please complete all fields.", variant: "destructive" });
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      toast({ title: "Invalid email", description: "Please enter a valid email address.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/consultations/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName,
          email: form.email,
          phone: form.phone,
          subject: form.subject,
          date: format(selectedDate, "EEEE, MMMM d, yyyy"),
          time: selectedTime,
        }),
      });

      if (res.ok) {
        setShowSuccess(true);
        // Reset the form for a possible next booking.
        setForm({ fullName: "", email: "", phone: "", subject: "" });
        setSelectedTime("");
        setSelectedDate(null);
      } else {
        const data = await res.json().catch(() => ({}));
        toast({ title: "Booking failed", description: data.message || "Please try again.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Network error", description: "Please check your connection and try again.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-primary flex items-center gap-2">
            <CalendarDays className="h-7 w-7 text-secondary" />
            Book an Onboarding Consulting Call
          </h1>
          <p className="text-muted-foreground mt-1">
            Select an available date and time, then share a few details. Our team will confirm your call.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-2 items-start">
          {/* ── Calendar + time slots ── */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">1. Choose a date & time</CardTitle>
              <CardDescription>Weekdays only. Past dates are unavailable.</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Month navigation */}
              <div className="flex items-center justify-between mb-4">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setViewMonth((m) => addMonths(m, -1))}
                  disabled={isSameDay(startOfMonth(viewMonth), startOfMonth(today))}
                  aria-label="Previous month"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="font-semibold text-foreground">{format(viewMonth, "MMMM yyyy")}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setViewMonth((m) => addMonths(m, 1))}
                  aria-label="Next month"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Weekday headers */}
              <div className="grid grid-cols-7 gap-1 mb-1">
                {WEEKDAY_LABELS.map((d) => (
                  <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-1">
                    {d}
                  </div>
                ))}
              </div>

              {/* Day grid */}
              <div className="grid grid-cols-7 gap-1">
                {dayCells.map((day, idx) => {
                  if (!day) return <div key={`blank-${idx}`} />;
                  const disabled = isDisabledDate(day);
                  const selected = selectedDate && isSameDay(day, selectedDate);
                  return (
                    <button
                      key={day.toISOString()}
                      type="button"
                      disabled={disabled}
                      onClick={() => handleSelectDate(day)}
                      className={[
                        "aspect-square rounded-md text-sm flex items-center justify-center transition-colors",
                        disabled
                          ? "text-muted-foreground/30 cursor-not-allowed"
                          : "hover:bg-secondary/15 text-foreground",
                        selected ? "bg-secondary text-secondary-foreground font-bold hover:bg-secondary" : "",
                      ].join(" ")}
                    >
                      {format(day, "d")}
                    </button>
                  );
                })}
              </div>

              {/* Time slots */}
              {selectedDate && (
                <div className="mt-6">
                  <p className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
                    <Clock className="h-4 w-4 text-secondary" />
                    Times for {format(selectedDate, "EEEE, MMM d")}
                  </p>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {TIME_SLOTS.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setSelectedTime(slot)}
                        className={[
                          "rounded-md border px-2 py-2 text-sm transition-colors",
                          selectedTime === slot
                            ? "border-secondary bg-secondary text-secondary-foreground font-semibold"
                            : "border-border hover:border-secondary hover:bg-secondary/10",
                        ].join(" ")}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Booking form ── */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">2. Your details</CardTitle>
              <CardDescription>
                {selectedDate && selectedTime
                  ? `Booking for ${format(selectedDate, "EEE, MMM d")} at ${selectedTime}`
                  : "Select a date and time to continue."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="fullName">Full Name <span className="text-red-500">*</span></Label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input id="fullName" className="pl-9" placeholder="John Smith"
                    value={form.fullName} onChange={(e) => updateForm("fullName", e.target.value)} required />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">Email Address <span className="text-red-500">*</span></Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input id="email" type="email" className="pl-9" placeholder="john@example.com"
                    value={form.email} onChange={(e) => updateForm("email", e.target.value)} required />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone Number <span className="text-red-500">*</span></Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input id="phone" type="tel" className="pl-9" placeholder="+1 (555) 000-0000"
                    value={form.phone} onChange={(e) => updateForm("phone", e.target.value)} required />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="subject">Subject / Issue <span className="text-red-500">*</span></Label>
                <div className="relative">
                  <FileText className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <textarea
                    id="subject"
                    className="w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-[90px] resize-none"
                    placeholder="Briefly describe what you'd like help with on the call…"
                    value={form.subject}
                    onChange={(e) => updateForm("subject", e.target.value)}
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 font-bold bg-secondary text-secondary-foreground hover:bg-secondary/90"
                disabled={isSubmitting || !selectedDate || !selectedTime}
              >
                {isSubmitting ? "Booking…" : "Book My Consulting Call"}
              </Button>
            </CardContent>
          </Card>
        </form>
      </div>

      {/* ── Success popup ── */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="max-w-md text-center">
          <DialogHeader>
            <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-3">
              <CheckCircle2 className="h-9 w-9 text-green-600" />
            </div>
            <DialogTitle className="text-xl font-serif text-primary">Booking Received 🎉</DialogTitle>
            <DialogDescription className="text-base text-foreground pt-2">
              One of our staff members will be in touch with you within one business day.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center pt-4">
            <Button className="px-8 bg-primary text-primary-foreground" onClick={() => setShowSuccess(false)}>
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
