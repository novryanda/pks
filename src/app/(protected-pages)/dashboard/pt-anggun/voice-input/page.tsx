import { auth } from "@/server/auth";
import { PTZTAVoiceInput } from "@/components/dashboard/pt-anggun/pt-zta-voice-input";
import { PermissionRedirect } from "@/components/dashboard/permission-redirect";

export default async function VoiceInputPage() {
    const session = await auth();

    return (
        <PermissionRedirect>
            <div className="py-6">
                <PTZTAVoiceInput />
            </div>
        </PermissionRedirect>
    );
}
