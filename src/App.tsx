import { Button } from "./components/ui/button"
import { Input } from "./components/ui/input"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "./components/ui/form"
import { ModelHolder } from "sbv2";
import React from "react";

const formSchema = z.object({
  // upload image png file
  bert: z.instanceof(File)
    .refine((file) => file.name.endsWith(".onnx"), {
      message: "Bert Modelはonnxファイルをアップロードしてください",
    }),
  tokenizer: z.instanceof(File)
    .refine((file) => file.name.endsWith(".json"), {
      message: "tokenizerはjsonファイルをアップロードしてください",
    }),
  sbv2: z.instanceof(File)
    .refine((file) => file.name.endsWith(".sbv2"), {
      message: "Style-Bert-VITS2 Modelはsbv2ファイルをアップロードしてください",
    }),
  text: z.string(),
});

function App() {
  const [audioUrl, setAudioUrl] = React.useState<string | undefined>(undefined);

  React.useEffect(() => {
    (async() => {
      await ModelHolder.globalInit(
        await (
            await fetch("https://esm.sh/sbv2@0.1.1/dist/sbv2_wasm_bg.wasm", { cache: "force-cache" })
        ).arrayBuffer(),
      );
    })();
  })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values)
    // Get file bytes
    const bertModel = await values.bert.arrayBuffer()
    const sbv2Model = await values.sbv2.arrayBuffer()
    const tokenizer = await values.tokenizer.text()
    const holder = await ModelHolder.create(tokenizer, bertModel);
    await holder.load("tmp", new Uint8Array(sbv2Model));
    // Return is Uint8Array
    const data = await holder.synthesize("tmp", values.text);
    const blob = new Blob([data], { type: "audio/wav" });
    const url = URL.createObjectURL(blob);
    setAudioUrl(url);
  }

  return (
    <>
      <div className="h-screen w-full flex flex-col items-center justify-center">
        <div className="space-y-4">
          <div>
            <h1 className="font-bold text-xl">Style-Bert-VITS2 Web版推論ページ</h1>
          </div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
                control={form.control}
                name="bert"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bert Model</FormLabel>
                    <FormControl>
                      <Input type="file" onChange={(e) => field.onChange(e.target.files?.[0])} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sbv2"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Style-Bert-VITS2 Model</FormLabel>
                    <FormControl>
                      <Input type="file" onChange={(e) => field.onChange(e.target.files?.[0])} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tokenizer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tokenizer</FormLabel>
                    <FormControl>
                      <Input type="file" onChange={(e) => field.onChange(e.target.files?.[0])} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="text"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Text</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit">生成する</Button>
            </form>
          </Form>
          {audioUrl && (
            <audio controls src={audioUrl} />
          )}
        </div>
      </div>
    </>
  )
}

export default App
