import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function PaymentCancelPage() {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <Card>
        <CardHeader>
          <CardTitle>Payment cancelled</CardTitle>
          <CardDescription>
            You left checkout before completing payment. Your join request stays pending until you
            finish paying or cancel it from My requests.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Nothing was charged. To try again, cancel the pending request on My requests, then send a
          new join request from the team page.
        </CardContent>
        <CardFooter className="flex flex-wrap gap-2">
          <Link href="/my-requests" className={buttonVariants({ variant: "default" })}>
            My requests
          </Link>
          <Link href="/tournaments" className={buttonVariants({ variant: "outline" })}>
            Tournaments
          </Link>
        </CardFooter>
      </Card>
    </main>
  );
}
