"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface ConsentGateProps {
  onAcknowledge: () => void;
}

/**
 * Placeholder copyright/privacy copy — standard boilerplate, not reviewed by
 * legal counsel. Replace with real, vetted terms before production use; see
 * CLAUDE.md's "Known limitations" for the broader POPIA-compliance gap this
 * only partially addresses.
 */
export function ConsentGate({ onAcknowledge }: ConsentGateProps) {
  const [checked, setChecked] = useState(false);

  return (
    <Card>
      <CardContent className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Before You Begin</h1>
          <p className="text-sm text-muted-foreground">Please review and acknowledge the terms below to continue.</p>
        </div>

        <div className="space-y-3 text-sm text-muted-foreground">
          <div>
            <h2 className="mb-1 font-medium text-foreground">Copyright &amp; Terms</h2>
            <p>
              © 2026 FaceM. All rights reserved. This application and its content are provided for facial measurement
              and eyewear/mask fitting purposes only. Unauthorized reproduction, distribution, or use of this software
              outside its intended purpose is prohibited.
            </p>
          </div>

          <div>
            <h2 className="mb-1 font-medium text-foreground">Privacy Notice</h2>
            <p>
              To measure your face, FaceM uses your device&apos;s camera to detect facial landmarks (including your
              eyes, pupils, nose, and jawline) and capture a photo. All detection and processing happens entirely
              within your browser — no image, video, or facial data is ever transmitted to or stored on a server.
              Captured measurements and photos are stored only in your browser&apos;s local storage on this device.
            </p>
            <p className="mt-2">
              Facial measurements and photos may be considered personal information (including biometric information)
              under South Africa&apos;s Protection of Personal Information Act (POPIA). By proceeding, you consent to
              this information being processed for the sole purpose of generating your facial measurements and
              frame-size/shape recommendations. You may delete any saved measurement at any time from the History
              page.
            </p>
            <p className="mt-2">
              This notice is a general summary and placeholder — consult qualified legal counsel before relying on it
              for production or compliance purposes.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Checkbox id="consent-checkbox" checked={checked} onCheckedChange={setChecked} />
          <Label htmlFor="consent-checkbox">I have read and agree to the copyright notice and privacy terms above.</Label>
        </div>

        <Button type="button" onClick={onAcknowledge} disabled={!checked}>
          Enter
        </Button>
      </CardContent>
    </Card>
  );
}
