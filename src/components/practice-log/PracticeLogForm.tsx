import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

interface PracticeLogFormProps {
  date: Date;
}

export function PracticeLogForm({ date }: PracticeLogFormProps) {
  const [mainGoals, setMainGoals] = useState("");
  const [subgoals, setSubgoals] = useState("");
  const [startTime, setStartTime] = useState("");
  const [stopTime, setStopTime] = useState("");
  const [totalTime, setTotalTime] = useState("");
  const [warmups, setWarmups] = useState(["", "", "", ""]);
  const [scales, setScales] = useState(["", "", "", ""]);
  const [repertoire, setRepertoire] = useState<string[]>(Array(10).fill(""));
  const [notes, setNotes] = useState("");
  const [additionalTasks, setAdditionalTasks] = useState([
    { text: "", checked: false },
    { text: "", checked: false },
    { text: "", checked: false },
    { text: "", checked: false },
  ]);
  const [musicListening, setMusicListening] = useState([
    { text: "", checked: false },
    { text: "", checked: false },
    { text: "", checked: false },
  ]);

  const dayName = date.toLocaleDateString("en-US", { weekday: "long" }).toUpperCase();
  const formattedDate = date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).toUpperCase().replace(",", "");

  const updateWarmup = (index: number, value: string) => {
    const newWarmups = [...warmups];
    newWarmups[index] = value;
    setWarmups(newWarmups);
  };

  const updateScale = (index: number, value: string) => {
    const newScales = [...scales];
    newScales[index] = value;
    setScales(newScales);
  };

  const updateRepertoire = (index: number, value: string) => {
    const newRepertoire = [...repertoire];
    newRepertoire[index] = value;
    setRepertoire(newRepertoire);
  };

  const updateTask = (index: number, field: "text" | "checked", value: string | boolean) => {
    const newTasks = [...additionalTasks];
    newTasks[index] = { ...newTasks[index], [field]: value };
    setAdditionalTasks(newTasks);
  };

  const updateListening = (index: number, field: "text" | "checked", value: string | boolean) => {
    const newListening = [...musicListening];
    newListening[index] = { ...newListening[index], [field]: value };
    setMusicListening(newListening);
  };

  return (
    <div className="flex-1 space-y-4 overflow-auto">
      {/* Date Header */}
      <h2 className="font-display text-xl md:text-2xl text-foreground">
        {dayName} – {formattedDate}
      </h2>

      {/* Goals Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card rounded-lg p-3 shadow-sm border border-border">
          <label className="font-display text-sm text-muted-foreground mb-2 block">Main Goals</label>
          <Textarea
            value={mainGoals}
            onChange={(e) => setMainGoals(e.target.value)}
            className="min-h-[80px] bg-transparent border-none resize-none focus-visible:ring-0 p-0"
            placeholder="What do you want to accomplish today?"
          />
        </div>
        <div className="bg-card rounded-lg p-3 shadow-sm border border-border">
          <label className="font-display text-sm text-muted-foreground mb-2 block">Subgoals</label>
          <Textarea
            value={subgoals}
            onChange={(e) => setSubgoals(e.target.value)}
            className="min-h-[80px] bg-transparent border-none resize-none focus-visible:ring-0 p-0"
            placeholder="Break down your goals..."
          />
        </div>
      </div>

      {/* Time Tracking */}
      <div className="bg-card rounded-lg p-3 shadow-sm border border-border">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="font-display text-sm text-muted-foreground block mb-1">Start Time:</label>
            <Input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="bg-transparent border-b border-border rounded-none px-0"
            />
          </div>
          <div>
            <label className="font-display text-sm text-muted-foreground block mb-1">Stop:</label>
            <Input
              type="time"
              value={stopTime}
              onChange={(e) => setStopTime(e.target.value)}
              className="bg-transparent border-b border-border rounded-none px-0"
            />
          </div>
          <div>
            <label className="font-display text-sm text-muted-foreground block mb-1">Total Time:</label>
            <Input
              value={totalTime}
              onChange={(e) => setTotalTime(e.target.value)}
              className="bg-transparent border-b border-border rounded-none px-0"
              placeholder="0:00"
            />
          </div>
        </div>
      </div>

      {/* Warmups and Scales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card rounded-lg p-3 shadow-sm border border-border">
          <label className="font-display text-sm text-muted-foreground mb-2 block">Warm-ups</label>
          <div className="space-y-2">
            {warmups.map((warmup, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="text-muted-foreground text-sm w-4">{index + 1}</span>
                <Input
                  value={warmup}
                  onChange={(e) => updateWarmup(index, e.target.value)}
                  className="bg-transparent border-b border-border rounded-none px-1 flex-1"
                />
              </div>
            ))}
          </div>
        </div>
        <div className="bg-card rounded-lg p-3 shadow-sm border border-border">
          <label className="font-display text-sm text-muted-foreground mb-2 block">Scales</label>
          <div className="space-y-2">
            {scales.map((scale, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="text-muted-foreground text-sm w-4">{index + 1}</span>
                <Input
                  value={scale}
                  onChange={(e) => updateScale(index, e.target.value)}
                  className="bg-transparent border-b border-border rounded-none px-1 flex-1"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Repertoire and Notes/Tasks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Repertoire */}
        <div className="bg-card rounded-lg p-3 shadow-sm border border-border">
          <label className="font-display text-sm text-muted-foreground mb-2 block">Repertoire & Exercises</label>
          <div className="space-y-1">
            {repertoire.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full border border-muted-foreground/30" />
                <Input
                  value={item}
                  onChange={(e) => updateRepertoire(index, e.target.value)}
                  className="bg-transparent border-b border-border rounded-none px-1 flex-1 h-7"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Notes, Tasks, Listening */}
        <div className="space-y-4">
          <div className="bg-card rounded-lg p-3 shadow-sm border border-border">
            <label className="font-display text-sm text-muted-foreground mb-2 block">Notes & Focus</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[80px] bg-transparent border-none resize-none focus-visible:ring-0 p-0"
              placeholder="Observations, breakthroughs, challenges..."
            />
          </div>

          <div className="bg-card rounded-lg p-3 shadow-sm border border-border">
            <label className="font-display text-sm text-muted-foreground mb-2 block">Additional Tasks</label>
            <div className="space-y-2">
              {additionalTasks.map((task, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Checkbox
                    checked={task.checked}
                    onCheckedChange={(checked) => updateTask(index, "checked", !!checked)}
                    className="border-muted-foreground/50"
                  />
                  <Input
                    value={task.text}
                    onChange={(e) => updateTask(index, "text", e.target.value)}
                    className="bg-transparent border-b border-border rounded-none px-1 flex-1 h-7"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card rounded-lg p-3 shadow-sm border border-border">
            <label className="font-display text-sm text-muted-foreground mb-2 block">Music Listening</label>
            <div className="space-y-2">
              {musicListening.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Checkbox
                    checked={item.checked}
                    onCheckedChange={(checked) => updateListening(index, "checked", !!checked)}
                    className="border-muted-foreground/50"
                  />
                  <Input
                    value={item.text}
                    onChange={(e) => updateListening(index, "text", e.target.value)}
                    className="bg-transparent border-b border-border rounded-none px-1 flex-1 h-7"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
