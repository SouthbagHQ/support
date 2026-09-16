"use client";

import { useState } from "react";
import * as shenanigans from "@/components/shenanigans";
import posthog from "posthog-js";
import {
  FormControl,
  InputLabel,
  MenuItem,
  Input as MUIInput,
  Select as MUISelect,
} from "@mui/material";
import AntdInput from "antd/es/input/Input";
import { Input as ShadcnInput } from "@/components/ui/input";
import { Command, CommandInput } from "@/components/ui/command";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Calendar } from "@/components/ui/calendar";
import { authClient } from "@/lib/auth-client";

export default function CreateTicketPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [fruit, setFruit] = useState("");
  const [contactReason, setContactReason] = useState("");
  const [message, setMessage] = useState("Enter your message");
  const [phoneNumber, setPhoneNumber] = useState([0]);
  const [howHeard, setHowHeard] = useState("");
  const [address, setAddress] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState<Date | undefined>(undefined);
  const [yearOfBirth, setYearOfBirth] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [orderId, setOrderId] = useState("");
  const [preferredContact, setPreferredContact] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [moreDetails, setMoreDetails] = useState("");
  const [evenMoreDetails, setEvenMoreDetails] = useState("");

  const [buttonX, setButtonX] = useState(0);
  const [buttonY, setButtonY] = useState(0);

  const session = authClient.useSession();

  function handleSubmit() {
    posthog.capture("support_ticket_submit_clicked", {
      signed_in: Boolean(session.data),
      contact_reason: contactReason || undefined,
      fruit: fruit || undefined,
    });
    const errors: string[] = [];

    if (!session.data && !name.trim()) {
      errors.push("Name is required");
    }

    if (!session.data) {
      if (!email.trim()) {
        errors.push("Email is required");
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push("Email is invalid");
      }
    }

    if (!fruit) {
      errors.push("Please select a fruit");
    }

    if (!contactReason) {
      errors.push("Contact reason is required");
    }

    if (!message.trim() || message === "Enter your message") {
      errors.push("Message is required");
    }

    if (!phoneNumber[0] || phoneNumber[0] === 0) {
      errors.push("Phone number is required");
    }

    if (!howHeard.trim()) {
      errors.push("Please tell us how you heard about us");
    }

    if (!address.trim()) {
      errors.push("Address is required");
    }

    if (!dateOfBirth) {
      errors.push("Date of birth is required");
    }

    if (!yearOfBirth) {
      errors.push("Year of birth is required");
    }

    if (!preferredContact.trim()) {
      errors.push("Preferred contact method is required");
    }

    if (!serialNumber.trim()) {
      errors.push("Device serial number is required");
    }

    if (!moreDetails.trim()) {
      errors.push("More details are required");
    }

    if (!evenMoreDetails.trim()) {
      errors.push("Even more details are required");
    }

    if (errors.length > 0) {
      posthog.capture("support_ticket_validation_failed", {
        error_count: errors.length,
        errors,
        fields_cleared: true,
      });
      alert("Please fix the following errors:\n\n" + errors.join("\n"));
      setName("");
      setEmail("");
      setFruit("");
      setContactReason("");
      setMessage("");
      setPhoneNumber([0]);
      setHowHeard("");
      setAddress("");
      setDateOfBirth(new Date());
      setYearOfBirth("");
      setReferenceNumber("");
      setOrderId("");
      setPreferredContact("");
      setSerialNumber("");
      setMoreDetails("");
      setEvenMoreDetails("");

      return;
    }

    if (session.data) {
      posthog.capture("support_ticket_rejected", { reason: "email_invalid" });
      alert("Email is invalid");
    } else {
      posthog.capture("support_ticket_rejected", { reason: "sign_in_required" });
      alert("Sign in required");
      location.href = "/login";
    }

    posthog.capture("ticket_submission_failed", {
      error_count: errors.length,
      errors: errors,
    });
  }

  return (
    <>
      <div className="max-w-3xl mx-auto w-full">
        <h1>Create Ticket</h1>
        <button
          onClick={handleSubmit}
          onMouseMove={(event) => {
            const element = event.currentTarget;
            const rect = element.getBoundingClientRect();
            const clientX = event.clientX;
            setTimeout(() => {
              const x = clientX - (rect.left + rect.width / 2);
              setButtonX(buttonX + (x > 0 ? -rect.width : rect.width));
            }, 100);
          }}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold fixed z-100000000000 p-4"
          style={{
            transform: `translate(${buttonX}px, ${buttonY}px)`,
          }}
        >
          Submit Ticket
        </button>
        <div className="p-4"></div>
      </div>
      <div className="max-w-4xl mx-auto w-full flex flex-col gap-10">
        <div>
          Name
          <ShadcnInput
            placeholder="Enter your name"
            disabled={!!session.data}
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            value={!!session.data ? "undefined" : name}
            onChange={(e) => setName(e.target.value)}
          />
          {session.data && <div>Prefilled from account</div>}
        </div>
        <div>
          Email
          <AntdInput
            placeholder="Enter your email"
            disabled={!!session.data}
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            value={!!session.data ? {} : email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {session.data && <div>Prefilled from account</div>}
        </div>
        <Select value={fruit} onValueChange={setFruit}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select a fruit" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Fruits</SelectLabel>
              <SelectItem value="apple">Apple</SelectItem>
              <SelectItem value="banana">Banana</SelectItem>
              <SelectItem value="blueberry">Blueberry</SelectItem>
              <SelectItem value="grapes">Grapes</SelectItem>
              <SelectItem value="pineapple">Pineapple</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        <div>
          Contact reason
          <FormControl fullWidth>
            <InputLabel id="demo-simple-select-label">
              Contact reason
            </InputLabel>
            <MUISelect
              label="Reason"
              value={contactReason}
              onChange={(e) => setContactReason(e.target.value)}
            >
              <MenuItem value={"support"}>Support</MenuItem>
            </MUISelect>
          </FormControl>
        </div>
        <textarea
          placeholder="Enter your message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        ></textarea>
        <div className="p-4 flex flex-col gap-2">
          Phone number
          <Slider
            value={phoneNumber}
            onValueChange={setPhoneNumber}
            min={0}
            max={100000000000}
          />
          +{phoneNumber}
        </div>
        <input
          type="text"
          placeholder="How did you hear about us"
          value={howHeard}
          onChange={(e) => setHowHeard(e.target.value)}
        />
        <MUIInput
          type="text"
          placeholder="Address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
        <div>
          Day of brith
          <Calendar
            mode="single"
            selected={dateOfBirth}
            onSelect={setDateOfBirth}
          />
          year of birth
          <select
            name=""
            id=""
            value={yearOfBirth}
            onChange={(e) => {
              setYearOfBirth(e.target.value);
            }}
          >
            {Array.from({ length: 3000 }, (_, i) => i)
              // eslint-disable-next-line react-hooks/purity
              .sort(() => Math.random() - 0.5)
              .map((value, i) => (
                <option key={i} value={value.toString()}>
                  {value}
                </option>
              ))}
          </select>
        </div>
        <input
          type="text"
          placeholder="Reference number (if you have one)"
          value={referenceNumber}
          onChange={(e) => setReferenceNumber(e.target.value)}
        />
        <MUIInput
          type="text"
          placeholder="Order ID (if you have one)"
          value={orderId}
          onChange={(e) => setOrderId(e.target.value)}
        />
        <ShadcnInput
          type="text"
          placeholder="Prefered contact method and time"
          value={preferredContact}
          onChange={(e) => setPreferredContact(e.target.value)}
        />
        <input
          type="text"
          placeholder="Device serial number"
          value={serialNumber}
          onChange={(e) => setSerialNumber(e.target.value)}
        />
        <input
          type="text"
          placeholder="More details"
          value={moreDetails}
          onChange={(e) => setMoreDetails(e.target.value)}
        />
        <input
          type="text"
          placeholder="Even more details"
          value={evenMoreDetails}
          onChange={(e) => setEvenMoreDetails(e.target.value)}
        />
      </div>
      Do you need help filling out this form?{" "}
      <a href="/createticket">Ask support</a>
    </>
  );
}
