"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PenTool, Trash2, Loader2, CheckCircle2 } from "lucide-react";
import SignatureCanvas from "react-signature-canvas";
import { saveUserSignature, getUserSignature, deleteUserSignature } from "@/actions/signatures";
import { toast } from "sonner";

export default function SignaturesPage() {
    const sigPad = useRef<SignatureCanvas>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [savedSignatureUrl, setSavedSignatureUrl] = useState<string | null>(null);

    useEffect(() => {
        async function fetchSignature() {
            const result = await getUserSignature();
            if (result && result.data) {
                setSavedSignatureUrl(result.data);
            }
            setIsLoading(false);
        }
        fetchSignature();
    }, []);

    const handleSave = async () => {
        if (sigPad.current?.isEmpty()) {
            toast.error("Please provide a signature first");
            return;
        }

        setIsSaving(true);
        try {
            const dataURL = sigPad.current?.getTrimmedCanvas().toDataURL("image/png");
            if (dataURL) {
                const result = await saveUserSignature(dataURL);
                if (result.error) throw new Error(result.error);

                toast.success("Signature saved securely!");

                // Refresh the token to display it
                const refreshResult = await getUserSignature();
                if (refreshResult && refreshResult.data) {
                    setSavedSignatureUrl(refreshResult.data);
                }
            }
        } catch (error) {
            toast.error("Failed to save signature");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        setIsLoading(true);
        try {
            const result = await deleteUserSignature();
            if (result.error) throw new Error(result.error);
            setSavedSignatureUrl(null);
            toast.success("Signature deleted");
        } catch (error) {
            toast.error("Failed to delete signature");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-8 max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Saved Signatures</h1>
                    <p className="text-muted-foreground">Manage your pre-drawn signature file for 1-click signing.</p>
                </div>
            </div>

            {isLoading ? (
                <Card className="border-dashed border-2 shadow-none min-h-[400px] flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </Card>
            ) : savedSignatureUrl ? (
                <Card className="border-2 border-primary/20 shadow-sm bg-primary/5">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="rounded-full bg-primary/20 p-4 mb-6">
                            <CheckCircle2 className="h-8 w-8 text-primary" />
                        </div>
                        <h2 className="text-xl font-semibold mb-6">Signature Saved</h2>

                        <div className="bg-card p-8 rounded-xl border shadow-sm mb-8 w-full max-w-md flex justify-center">
                            <img src={savedSignatureUrl} alt="Your Saved Signature" className="max-h-32 object-contain dark:invert" />
                        </div>

                        <Button variant="destructive" onClick={handleDelete} className="gap-2">
                            <Trash2 className="h-4 w-4" /> Delete Signature
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <Card className="border-2 shadow-sm">
                    <CardContent className="flex flex-col items-center justify-center py-12 px-8">
                        <div className="w-full max-w-2xl">
                            <h2 className="text-xl font-semibold mb-2">Draw Your Signature</h2>
                            <p className="text-muted-foreground mb-6">
                                Draw your official signature below. We will securely store it so you never have to draw it again when signing documents.
                            </p>

                            <div className="rounded-xl border-2 border-dashed border-border bg-card relative overflow-hidden mb-6">
                                <SignatureCanvas
                                    ref={sigPad}
                                    penColor="black"
                                    canvasProps={{ className: "w-full min-h-[300px]" }}
                                />
                            </div>

                            <div className="flex justify-end gap-3 w-full">
                                <Button variant="outline" onClick={() => sigPad.current?.clear()} disabled={isSaving}>
                                    Clear Canvas
                                </Button>
                                <Button
                                    className="w-40"
                                    onClick={handleSave}
                                    disabled={isSaving}
                                >
                                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <PenTool className="h-4 w-4 mr-2" />}
                                    Save Signature
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
