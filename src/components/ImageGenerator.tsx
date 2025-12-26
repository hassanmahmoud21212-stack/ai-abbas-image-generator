import React, { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Sparkles, Upload, X, Download, Loader2, Image as ImageIcon } from 'lucide-react';

export function ImageGenerator() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [sourceImageFile, setSourceImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSourceImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setSourceImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeSourceImage = () => {
    setSourceImage(null);
    setSourceImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    if (!user) {
      toast.error('Please log in to generate images');
      return;
    }

    setIsGenerating(true);
    setGeneratedImage(null);

    try {
      let sourceImageUrl: string | null = null;

      // Upload source image if provided
      if (sourceImageFile && user) {
        const fileExt = sourceImageFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('source-images')
          .upload(fileName, sourceImageFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('source-images')
          .getPublicUrl(fileName);
        
        sourceImageUrl = urlData.publicUrl;
      }

      // Call the edge function
      const { data, error } = await supabase.functions.invoke('generate-image', {
        body: { 
          prompt,
          sourceImageUrl
        }
      });

      if (error) throw error;

      if (data?.imageUrl) {
        setGeneratedImage(data.imageUrl);
        toast.success(t('success.generated'));

        // Save to history
        const { error: saveError } = await supabase
          .from('generated_images')
          .insert({
            user_id: user.id,
            prompt,
            image_url: data.imageUrl,
            source_image_url: sourceImageUrl
          });

        if (saveError) {
          console.error('Failed to save to history:', saveError);
        }
      }
    } catch (error) {
      console.error('Generation error:', error);
      toast.error(t('error.generation'));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!generatedImage) return;

    try {
      const response = await fetch(generatedImage);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `abbas-ai-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download image');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Input Section */}
      <div className="glass rounded-2xl p-6 space-y-4">
        <div className="relative">
          <Textarea
            placeholder={t('generator.placeholder')}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[120px] resize-none bg-background/50 border-border/50 focus:border-primary rounded-xl text-lg"
            disabled={isGenerating}
          />
        </div>

        {/* Source Image Preview */}
        {sourceImage && (
          <div className="relative inline-block">
            <img
              src={sourceImage}
              alt="Source"
              className="h-24 w-24 object-cover rounded-xl border border-border"
            />
            <button
              onClick={removeSourceImage}
              className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isGenerating}
            className="rounded-xl"
          >
            <Upload className="w-4 h-4 me-2" />
            {t('generator.upload')}
          </Button>

          <Button
            onClick={handleGenerate}
            disabled={!prompt.trim() || isGenerating}
            className="rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity ms-auto"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 me-2 animate-spin" />
                {t('generator.generating')}
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 me-2" />
                {t('generator.generate')}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Generated Image Display */}
      <div className="glass rounded-2xl p-6 min-h-[400px] flex items-center justify-center">
        {isGenerating ? (
          <div className="text-center space-y-4">
            <div className="relative w-24 h-24 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin"></div>
              <Sparkles className="absolute inset-0 m-auto w-8 h-8 text-primary animate-pulse" />
            </div>
            <p className="text-muted-foreground">{t('generator.generating')}</p>
          </div>
        ) : generatedImage ? (
          <div className="space-y-4 w-full">
            <div className="relative group rounded-xl overflow-hidden">
              <img
                src={generatedImage}
                alt="Generated"
                className="w-full h-auto rounded-xl animate-scale-in"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-4">
                <Button
                  onClick={handleDownload}
                  className="rounded-xl bg-primary hover:bg-primary/90"
                >
                  <Download className="w-4 h-4 me-2" />
                  {t('generator.download')}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-4">
            <div className="w-24 h-24 mx-auto rounded-2xl bg-muted/50 flex items-center justify-center">
              <ImageIcon className="w-10 h-10 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground max-w-md">
              {t('hero.subtitle')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
