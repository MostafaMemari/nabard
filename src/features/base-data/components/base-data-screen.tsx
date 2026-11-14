"use client";

import { PageHeader } from "@/components/shared";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAgeCategoriesAdmin } from "../hooks/use-base-data-admin";
import { AgeCategoriesTab } from "./age-categories-tab";
import { BeltsTab } from "./belts-tab";
import { WeightClassesTab } from "./weight-classes-tab";

export function BaseDataScreen() {
  const { ageCategories } = useAgeCategoriesAdmin(true);

  return (
    <>
      <PageHeader title="اطلاعات پایه" description="کمربندها، رده های سنی و رده های وزنی؛ تغییرها فقط روی مسابقه های جدید اعمال می شود" />

      <Tabs defaultValue="belts" className="gap-3">
        <TabsList className="w-full max-w-md sm:w-fit">
          <TabsTrigger value="belts">کمربندها</TabsTrigger>
          <TabsTrigger value="age-categories">رده های سنی</TabsTrigger>
          <TabsTrigger value="weight-classes">رده های وزنی</TabsTrigger>
        </TabsList>
        <TabsContent value="belts">
          <BeltsTab />
        </TabsContent>
        <TabsContent value="age-categories">
          <AgeCategoriesTab />
        </TabsContent>
        <TabsContent value="weight-classes">
          <WeightClassesTab ageCategories={ageCategories} />
        </TabsContent>
      </Tabs>
    </>
  );
}
