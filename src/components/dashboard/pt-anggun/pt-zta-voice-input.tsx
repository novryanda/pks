"use client"

import * as React from "react"
import { Mic, MicOff, Send, FileText, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

export function PTZTAVoiceInput() {
    const [isListening, setIsListening] = React.useState(false)
    const [activeTab, setActiveTab] = React.useState("invoice")
    const [transcript, setTranscript] = React.useState("")

    // Invoice Form State
    const [invoiceData, setInvoiceData] = React.useState({
        number: "000/INV/ZTA/07/2025",
        date: "23-Jul-25",
        poNum: "9000774035",
        subject: "MANPOWER FABRIKASI",
        to: "PT. RIAU ANDALAN PULP & PAPER",
        period: "JULI 2025",
    })

    // CoA Form State
    const [coaData, setCoaData] = React.useState({
        refNo: "000/INV/ZTA/07/2025",
        prNo: "1810859337-002",
        poNo: "9000790181-001",
        jobDesc: "MANPOWER NON REGULAR ASSIST FABRICATION WS",
        amount: "15.817.850",
    })

    const toggleListening = () => {
        setIsListening(!isListening)
        if (!isListening) {
            setTranscript("Listening for: 'Set Invoice Number to...'")
            // Simulate voice recognition logic
            setTimeout(() => {
                setTranscript("Heard: 'Set Invoice Number to 999/INV/2026'")
            }, 2000)
        } else {
            setTranscript("")
        }
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                        Smart Document Input
                    </h1>
                    <p className="text-muted-foreground">
                        Update data using voice commands or manual input.
                    </p>
                </div>

                <div className="flex items-center gap-3 bg-card border rounded-full px-4 py-2 shadow-sm">
                    <div className={cn(
                        "size-2 rounded-full",
                        isListening ? "bg-red-500 animate-pulse" : "bg-muted-foreground/30"
                    )} />
                    <span className="text-sm font-medium">
                        {isListening ? "AI Assistant Active" : "AI Assistant Standby"}
                    </span>
                    <Button
                        size="icon"
                        variant={isListening ? "destructive" : "outline"}
                        className="rounded-full size-10"
                        onClick={toggleListening}
                    >
                        {isListening ? <Mic className="size-5 animate-pulse" /> : <Mic className="size-5" />}
                    </Button>
                </div>
            </div>

            {isListening && (
                <div className="bg-primary/5 border-primary/20 border rounded-xl p-4 animate-in slide-in-from-top-4">
                    <div className="flex items-center gap-3">
                        <Loader2 className="size-4 animate-spin text-primary" />
                        <p className="text-sm font-medium italic text-primary">
                            {transcript || "Speak now..."}
                        </p>
                    </div>
                </div>
            )}

            <Tabs defaultValue="invoice" className="w-full" onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2 mb-8 h-12">
                    <TabsTrigger value="invoice" className="flex items-center gap-2">
                        <FileText className="size-4" /> Invoice
                    </TabsTrigger>
                    <TabsTrigger value="coa" className="flex items-center gap-2">
                        <CheckCircle2 className="size-4" /> Certificate of Acceptance
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="invoice">
                    <Card className="border-none shadow-xl bg-gradient-to-b from-card to-background">
                        <CardHeader className="border-b bg-muted/30">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-xl uppercase">Invoice Entry</CardTitle>
                                    <CardDescription>PT. Zakiyah Talita Anggun</CardDescription>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs font-bold text-primary px-2 py-1 bg-primary/10 rounded">INTERNAL DOCUMENT</div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-8 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="inv-num">Invoice Number</Label>
                                        <Input id="inv-num" value={invoiceData.number} onChange={(e) => setInvoiceData({ ...invoiceData, number: e.target.value })} className="bg-muted/50" />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="date">Date</Label>
                                        <Input id="date" value={invoiceData.date} onChange={(e) => setInvoiceData({ ...invoiceData, date: e.target.value })} className="bg-muted/50" />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="po-num">PO Number</Label>
                                        <Input id="po-num" value={invoiceData.poNum} onChange={(e) => setInvoiceData({ ...invoiceData, poNum: e.target.value })} className="bg-muted/50" />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="subject">Subject</Label>
                                        <Input id="subject" value={invoiceData.subject} onChange={(e) => setInvoiceData({ ...invoiceData, subject: e.target.value })} className="bg-muted/50 font-bold" />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="to">To</Label>
                                        <Input id="to" value={invoiceData.to} onChange={(e) => setInvoiceData({ ...invoiceData, to: e.target.value })} className="bg-muted/50" />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="period">Period Of</Label>
                                        <Input id="period" value={invoiceData.period} onChange={(e) => setInvoiceData({ ...invoiceData, period: e.target.value })} className="bg-muted/50" />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 border-t">
                                <Label className="text-xs font-bold uppercase text-muted-foreground mb-4 block">Line Items</Label>
                                <div className="rounded-lg border overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead className="bg-muted">
                                            <tr>
                                                <th className="text-left p-3">Description</th>
                                                <th className="text-right p-3">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr className="border-t">
                                                <td className="p-3 font-medium">1. MANPOWER NON REGULAR ASSIST FABRICATION WORKSHOP</td>
                                                <td className="p-3 text-right">Rp 15.817.850</td>
                                            </tr>
                                            <tr className="border-t bg-muted/10 font-bold">
                                                <td className="p-3">TOTAL</td>
                                                <td className="p-3 text-right">Rp 15.817.850</td>
                                            </tr>
                                            <tr className="border-t text-muted-foreground">
                                                <td className="p-2 text-right">PPN 11%</td>
                                                <td className="p-2 text-right">Rp 1.739.964</td>
                                            </tr>
                                            <tr className="border-t text-lg font-bold bg-primary/5">
                                                <td className="p-3">Nett Invoice to be Paid</td>
                                                <td className="p-3 text-right text-primary">Rp 17.557.814</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="bg-muted/30 border-t flex justify-end gap-3 p-6">
                            <Button variant="outline">Reset Form</Button>
                            <Button className="px-8 shadow-md">
                                <Send className="size-4 mr-2" /> Submit Document
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                <TabsContent value="coa">
                    <Card className="border-none shadow-xl">
                        <CardHeader className="border-b bg-emerald-500/5">
                            <CardTitle className="text-xl uppercase">Certificate of Acceptance</CardTitle>
                            <CardDescription>Job Completion Verification</CardDescription>
                        </CardHeader>
                        <CardContent className="p-8 space-y-6">
                            <div className="grid gap-4 md:grid-cols-3">
                                <div className="grid gap-2">
                                    <Label>No. Referensi</Label>
                                    <Input value={coaData.refNo} className="bg-muted/30" />
                                </div>
                                <div className="grid gap-2">
                                    <Label>PR No</Label>
                                    <Input value={coaData.prNo} className="bg-muted/30" />
                                </div>
                                <div className="grid gap-2">
                                    <Label>PO No</Label>
                                    <Input value={coaData.poNo} className="bg-muted/30" />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label>Job Description</Label>
                                <textarea
                                    className="flex min-h-[80px] w-full rounded-md border border-input bg-muted/30 px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 font-medium"
                                    value={coaData.jobDesc}
                                />
                            </div>

                            <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-2xl bg-muted/10">
                                <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                                    <CheckCircle2 className="size-8 text-primary" />
                                </div>
                                <h3 className="text-lg font-semibold">Workflow Ready</h3>
                                <p className="text-sm text-muted-foreground max-w-xs text-center">
                                    This COA is ready for verification by Area Planner/Supervisor.
                                </p>
                            </div>
                        </CardContent>
                        <CardFooter className="bg-muted/30 border-t flex justify-end gap-3 p-6">
                            <Button variant="outline">Preview PDF</Button>
                            <Button className="bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20 shadow-lg">
                                Approve & Post
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>
            </Tabs>

            <div className="text-center pb-8">
                <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                    <AlertCircle className="size-3" /> Tip: Try saying "Submit form" or "Switch to CoA"
                </p>
            </div>
        </div>
    )
}
