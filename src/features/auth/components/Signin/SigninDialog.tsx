import { LogIn } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { GitHubIcon } from '~/common/components/icons/GitHubIcon';
import { GoogleIcon } from '~/common/components/icons/GoogleIcon';
import { Button } from '~/common/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle
} from '~/common/components/ui/dialog';
import { Separator } from '~/common/components/ui/separator';
import { useDialog } from '~/common/hooks/useDialog';
import { useAuth } from '~/features/auth/hooks/useAuth';

const SignInDialog = () => {
	const t = useTranslations('auth');
	const { isDialogOpen, closeDialog } = useDialog('signIn');
	const { signInWithOAuth } = useAuth();

	return (
		<Dialog open={isDialogOpen} onOpenChange={closeDialog}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader className="space-y-3 text-center">
					<DialogTitle className="flex items-center justify-center gap-2 text-2xl">
						<LogIn className="h-6 w-6" />
						{t('welcomeBack')}
					</DialogTitle>
					<DialogDescription className="text-base">
						{t('signInDescription')}
					</DialogDescription>
				</DialogHeader>

				<div className="flex flex-col gap-4 py-4">
					<Button
						variant="outline"
						className="h-11 w-full font-medium text-base transition-all hover:bg-accent/50 hover:shadow-md"
						onClick={() => signInWithOAuth('oauth_google')}
					>
						<GoogleIcon className="mr-3 h-5 w-5" />
						{t('signInWithGoogle')}
					</Button>
					<Button
						variant="outline"
						className="h-11 w-full font-medium text-base transition-all hover:bg-accent/50 hover:shadow-md"
						onClick={() => signInWithOAuth('oauth_github')}
					>
						<GitHubIcon className="mr-3 h-5 w-5" />
						{t('signInWithGitHub')}
					</Button>
				</div>

				<div className="relative">
					<div className="absolute inset-0 flex items-center">
						<Separator />
					</div>
					<div className="relative flex justify-center text-xs uppercase">
						<span className="bg-background px-2 text-muted-foreground">
							{t('secureAuthentication')}
						</span>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default SignInDialog;
