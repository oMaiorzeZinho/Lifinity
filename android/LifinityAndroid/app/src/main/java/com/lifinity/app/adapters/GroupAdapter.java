package com.lifinity.app.adapters;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.lifinity.app.R;
import com.lifinity.app.models.Group;

import java.util.ArrayList;
import java.util.List;

/** Adapter da lista dos meus grupos. O clique abre o menu de ações do grupo. */
public class GroupAdapter extends RecyclerView.Adapter<GroupAdapter.ViewHolder> {

    public interface OnGroupClickListener {
        void onGroupClick(Group group);
    }

    private final List<Group> groups = new ArrayList<>();
    private final OnGroupClickListener clickListener;

    public GroupAdapter(OnGroupClickListener clickListener) {
        this.clickListener = clickListener;
    }

    public void setGroups(List<Group> newGroups) {
        groups.clear();
        if (newGroups != null) {
            groups.addAll(newGroups);
        }
        notifyDataSetChanged();
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_group, parent, false);
        return new ViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        holder.bind(groups.get(position), clickListener);
    }

    @Override
    public int getItemCount() {
        return groups.size();
    }

    static class ViewHolder extends RecyclerView.ViewHolder {
        private final TextView nameText;
        private final TextView metaText;
        private final TextView roleBadge;
        private final TextView lockedBadge;

        ViewHolder(@NonNull View itemView) {
            super(itemView);
            nameText = itemView.findViewById(R.id.groupNameText);
            metaText = itemView.findViewById(R.id.groupMetaText);
            roleBadge = itemView.findViewById(R.id.groupRoleBadge);
            lockedBadge = itemView.findViewById(R.id.groupLockedBadge);
        }

        void bind(Group group, OnGroupClickListener listener) {
            nameText.setText(group.getName());

            int count = group.getMemberCount();
            String memberLabel = count == 1 ? "1 membro" : count + " membros";
            metaText.setText(memberLabel + " · " + (group.isAdmin() ? "Admin" : "Membro"));

            roleBadge.setVisibility(group.isAdmin() ? View.VISIBLE : View.GONE);
            lockedBadge.setVisibility(group.isLocked() ? View.VISIBLE : View.GONE);

            itemView.setOnClickListener(v -> {
                if (listener != null) listener.onGroupClick(group);
            });
        }
    }
}
